# Neural quantum states

> **In brief.** A neural quantum state uses a neural network as the map from a basis configuration to a wavefunction amplitude. Since the network is evaluated one configuration at a time, the state is never stored; it is sampled with Monte Carlo and optimized by minimizing the variational energy. The architecture decides which states can be represented and how efficiently they can be sampled; the sign or phase structure is the part that decides whether a given problem is easy or hard.

Notation follows the [conventions page](../notation/).

## Definition

Fix an orthonormal basis $\{|\boldsymbol{\sigma}\rangle\}$ of the Hilbert space: spin configurations, occupation numbers, or particle coordinates. A neural quantum state (NQS) is the family of states

$$
|\Psi_\theta\rangle=\sum_{\boldsymbol{\sigma}}\Psi_\theta(\boldsymbol{\sigma})\,|\boldsymbol{\sigma}\rangle ,
$$

in which $\Psi_\theta:\boldsymbol{\sigma}\mapsto\mathbb C$ is a neural network with parameters $\theta$ (Carleo and Troyer, arXiv:1606.02318). Two properties distinguish it from a tensor network or a Jastrow–Slater state. The amplitude is defined by a function rather than by a stored object, so the memory cost is the number of parameters and not the number of amplitudes; and no normalization is imposed, because every quantity needed by variational Monte Carlo is a ratio $\Psi_\theta(\boldsymbol{\sigma}')/\Psi_\theta(\boldsymbol{\sigma})$ or a derivative of $\log\Psi_\theta$.

The network therefore has to provide three operations: evaluation of $\log\Psi_\theta(\boldsymbol{\sigma})$, cheap ratios between configurations that differ locally (needed by the [local energy](../variational-monte-carlo/) and by Metropolis sampling), and the log-derivatives $O_k=\partial_{\theta_k}\log\Psi_\theta$ (needed by every [optimizer](../optimization/)). Reverse-mode differentiation supplies the last at the cost of one extra pass.

## Amplitude and phase

Writing

$$
\Psi_\theta(\boldsymbol{\sigma})=\exp\!\bigl[A_\theta(\boldsymbol{\sigma})+i\varphi_\theta(\boldsymbol{\sigma})\bigr]
$$

separates the log-modulus $A_\theta$ from the phase $\varphi_\theta$. A network with real parameters and real output represents only $A_\theta$, i.e. states that are positive in the chosen basis. By the Perron–Frobenius theorem these include the ground states of stoquastic Hamiltonians, those whose off-diagonal elements are all non-positive in that basis, after a basis rotation that makes them so: the transverse-field Ising model, bosons without frustration, and the Heisenberg antiferromagnet on a bipartite lattice through the Marshall sign rule.

Everything else requires $\varphi_\theta$, and the phase is where the difficulty concentrates. Frustrated magnets and fermions have ground states whose sign changes in ways no local rule captures, and a network that gets the amplitudes right but the signs wrong on a small fraction of configurations can be far from the ground state in energy. The choices in use are complex parameters with a holomorphic $\log\Psi_\theta$ (the original complex RBM), separate real networks for $A_\theta$ and $\varphi_\theta$, a fixed sign prior multiplied by a positive network, or a fermionic determinant that carries the antisymmetry; see the [RBM page](../restricted-boltzmann-machine/) and the [J₁–J₂ benchmark page](../j1j2-square-lattice/) for how this plays out.

## Symmetries

A symmetry group $G$ of the Hamiltonian can be imposed on the ansatz in two ways. Weight sharing makes $\Psi_\theta$ invariant by construction: translation invariance through convolutions, and general space-group invariance through group convolutions (Roth and MacDonald, arXiv:2104.05085). Group averaging projects an arbitrary network onto one irreducible representation,

$$
\Psi^{(\Gamma)}_\theta(\boldsymbol{\sigma})=\sum_{g\in G}\chi_\Gamma(g)^*\,\Psi_\theta(g\boldsymbol{\sigma}),
$$

at a cost of $|G|$ evaluations per amplitude, with $\chi_\Gamma$ the character. Projection targets a chosen momentum and point-group sector and can select excited states; it is also the mechanism of quantum-number projection in the RBM plus pair-product states of Nomura et al. (arXiv:1709.06475). Spin rotation symmetry is usually enforced only partially, through the $S^z$ sector and the spin-flip parity.

## Architectures

- **Restricted Boltzmann machine.** One hidden layer, analytic marginalization, a closed-form $\log\Psi_\theta$; the reference architecture and the subject of its [own page](../restricted-boltzmann-machine/).
- **Feed-forward and convolutional networks.** Dense layers (Cai and Liu, arXiv:1704.05148; Saito, arXiv:1707.09723) and convolutional layers with translation-invariant pooling (Choo, Neupert, Carleo, arXiv:1903.06713; Liang et al., arXiv:1807.09422). Group-convolutional networks extend the weight sharing to the full space group and are among the most accurate ansätze on frustrated lattices (Roth, Szabó, MacDonald, arXiv:2211.07749).
- **Autoregressive models.** Factorize $\Psi_\theta(\boldsymbol{\sigma})=\prod_i\psi_i(\sigma_i|\sigma_{<i})$ with normalized conditionals, so that $|\Psi_\theta|^2$ can be sampled exactly without a Markov chain: PixelCNN-style networks (Sharir et al., arXiv:1902.04057) and recurrent networks (Hibat-Allah et al., arXiv:2002.02973).
- **Transformers.** Attention over site embeddings, with or without the autoregressive constraint (Viteritti, Rende, Becca, arXiv:2211.05504); currently competitive with group-convolutional networks on the J₁–J₂ model.
- **Fermionic states.** A Slater or Pfaffian determinant supplies antisymmetry, and the network supplies either a multiplicative correlator, a backflow transformation of the orbitals (Luo and Clark, arXiv:1807.10770), or hidden degrees of freedom that enlarge the determinant (Moreno et al., arXiv:2111.10420). In continuous space the same idea gives FermiNet (Pfau et al., arXiv:1909.02487) and PauliNet (Hermann, Schätzle, Noé, arXiv:1909.08423).

## Expressivity versus trainability

Representation theorems establish that RBMs with polynomially many hidden units represent states with volume-law entanglement and several exactly solvable models (Deng, Li, Das Sarma, arXiv:1701.04844; Gao and Duan, arXiv:1701.05039), and that deep networks contract tensor networks efficiently while the converse fails (Sharir, Shashua, Carleo, arXiv:2103.10293). These results bound what an architecture *can* express. What a stochastic optimizer *finds* from a random initialization is a different question, and on frustrated models the gap between the two is the practical limit; it is the reason the optimizer, the sampling budget and the symmetry treatment appear in every benchmark entry alongside the architecture.

## In this book

The [variational Monte Carlo page](../variational-monte-carlo/) covers estimators and error bars, the [optimization page](../optimization/) covers stochastic reconfiguration and its kernel formulation, the architecture pages cover specific ansätze, and the benchmark pages fix the instances on which Ketboard compares energies. The [conventions page](../benchmark-conventions/) states what makes a result eligible.

## References

- G. Carleo, M. Troyer, *Solving the quantum many-body problem with artificial neural networks*, arXiv:1606.02318 (2016). The founding paper: complex RBM, stochastic reconfiguration, ground states and dynamics.
- H. Lange, A. Van de Walle, A. Bohrdt, *From architectures to applications: a review of neural quantum states*, arXiv:2402.09402 (2024). Survey of architectures and applications.
- K. Choo, T. Neupert, G. Carleo, *Study of the two-dimensional frustrated J₁–J₂ model with neural network quantum states*, arXiv:1903.06713 (2019). Convolutional NQS and the sign-structure problem on a frustrated lattice.
- C. Roth, A. H. MacDonald, *Group convolutional neural networks improve quantum state accuracy*, arXiv:2104.05085 (2021).
- O. Sharir, Y. Levine, N. Wies, G. Carleo, A. Shashua, *Deep autoregressive models for the efficient variational simulation of many-body quantum systems*, arXiv:1902.04057 (2019).
- M. Hibat-Allah, M. Ganahl, L. E. Hayward, R. G. Melko, J. Carrasquilla, *Recurrent neural network wave functions*, arXiv:2002.02973 (2020).
- L. L. Viteritti, R. Rende, F. Becca, *Transformer variational wave functions for frustrated quantum spin systems*, arXiv:2211.05504 (2022).
- D. Luo, B. K. Clark, *Backflow transformations via neural networks for quantum many-body wave functions*, arXiv:1807.10770 (2018).
- J. R. Moreno, G. Carleo, A. Georges, J. Stokes, *Fermionic wave functions from neural-network constrained hidden states*, arXiv:2111.10420 (2021).
- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487 (2019).
- J. Hermann, Z. Schätzle, F. Noé, *Deep neural network solution of the electronic Schrödinger equation*, arXiv:1909.08423 (2019).
- D.-L. Deng, X. Li, S. Das Sarma, *Quantum entanglement in neural network states*, arXiv:1701.04844 (2017).
- X. Gao, L.-M. Duan, *Efficient representation of quantum many-body states with deep neural networks*, arXiv:1701.05039 (2017).
- O. Sharir, A. Shashua, G. Carleo, *Neural tensor contractions and the expressive power of deep neural quantum states*, arXiv:2103.10293 (2021).
- Y. Nomura, A. S. Darmawan, Y. Yamaji, M. Imada, *Restricted Boltzmann machine learning for solving strongly correlated quantum systems*, arXiv:1709.06475 (2017).
- Z. Cai, J. Liu, *Approximating quantum many-body wave functions using artificial neural networks*, arXiv:1704.05148 (2017).
- H. Saito, *Solving the Bose–Hubbard model with machine learning*, arXiv:1707.09723 (2017).
- X. Liang, W.-Y. Liu, P.-Z. Lin, G.-C. Guo, Y.-S. Zhang, L. He, *Solving frustrated quantum many-particle models with convolutional neural networks*, arXiv:1807.09422 (2018).
