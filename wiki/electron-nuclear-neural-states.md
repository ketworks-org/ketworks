# Electron–nuclear neural states

> **In brief.** Quantum nuclei require a wavefunction of both electronic and nuclear coordinates, with kinetic-energy derivatives for both species. Neural architectures can couple the species through message passing and orbitals that follow the nuclei. A nuclear factor multiplied by a nuclear-coordinate-dependent electronic state can describe electron–nuclear entanglement; this product form alone does not impose the Born–Oppenheimer approximation.

Notation follows the [conventions page](../notation/). Write the configuration of $N$ electrons as $\mathbf R=(\mathbf r_1,\ldots,\mathbf r_N)$ and that of $N_{\mathrm n}$ nuclei as $\mathbf Q=(\mathbf R_1,\ldots,\mathbf R_{N_{\mathrm n}})$, distinguishing individual nuclear positions $\mathbf R_A$ from the electronic configuration.

## The joint variational state

In Hartree atomic units, the coupled Hamiltonian is

$$
H=-\frac12\sum_i\nabla_{\mathbf r_i}^2
-\sum_A\frac{1}{2M_A}\nabla_{\mathbf R_A}^2
+V(\mathbf R,\mathbf Q),
$$

where $M_A$ is a nuclear mass in electron masses and $V$ contains electron–electron, electron–nucleus and nucleus–nucleus interactions. Periodic Coulomb systems require the corresponding Ewald sum.

A useful parameterization is

$$
\Psi_\theta(\mathbf R,\mathbf Q)=
\Phi_\theta(\mathbf Q)\,
D_\theta(\mathbf R;\mathbf Q)\,
e^{J_\theta(\mathbf R,\mathbf Q)}.
$$

Here $D_\theta$ is antisymmetric under the required electron exchanges, $\Phi_\theta$ controls nuclear amplitudes, and $J_\theta$ is a symmetric correlator. The dependence of $D_\theta$ and $J_\theta$ on both configurations lets this form represent nonseparable electron–nuclear states. Clamping $\mathbf Q$ instead makes it an external parameter and removes the nuclear kinetic term.

## Atomic hydrogen: coupled particle graphs

Linteau, Moroni, Carleo and Holzmann couple electron–electron and electron–proton graph updates. Periodic relative features feed the network; electron vertex outputs give complex backflow coordinates, while electron edge outputs add a symmetric correlation term (arXiv:2504.07062v3, Method and Appendix A).

The electronic orbitals sum Gaussians centred on instantaneous protons and their images:

$$
\phi_{\mathbf k}(\mathbf r_i;\mathbf Q)=
\sum_{\mathbf n\in\mathbb Z^3}\sum_A
e^{i\mathbf k\cdot(\mathbf R_A+\mathbf nL)}
\chi(\mathbf r_i-\mathbf R_A-\mathbf nL).
$$

Here $L$ is the cubic cell length and $\chi$ a Gaussian with a variational width. Neural backflow replaces $\mathbf r_i$ only in the orbital part (Eqs. 3–5).

The BCC quantum-proton benchmark uses Gaussian site localization (Table II). In the unrestricted construction, a separate proton-only graph network models nuclear correlations, allowing liquid and crystalline states without prescribing a lattice (Method; Results). These are distinct nuclear ansätze within the same framework.

## Orbitals that follow moving nuclei

The orbital formula makes the boundary condition explicit. Replace $\mathbf r_i$ by $\mathbf r_i+L\mathbf e_a$ and reindex the image sum using $\mathbf n'=\mathbf n-\mathbf e_a$. Then

$$
\phi_{\mathbf k}(\mathbf r_i+L\mathbf e_a;\mathbf Q)
=e^{ik_aL}\phi_{\mathbf k}(\mathbf r_i;\mathbf Q).
$$

Choosing $\mathbf k=\mathbf G+\mathbf k_s$, with $\mathbf G$ a cell reciprocal vector, makes the phase independent of the orbital label. The electronic determinant therefore has the required twist. A periodic backflow displacement preserves this argument.

Moving a proton changes the Gaussian centres and their phases, so the electronic orbitals respond directly to its instantaneous position. A common displacement $\mathbf a$ of all electrons and protons multiplies each orbital by $e^{i\mathbf k\cdot\mathbf a}$, leaving its relative-coordinate Gaussian unchanged. The determinant can carry a total-momentum phase while its probability density remains translation invariant, provided the other factors depend only on relative coordinates. This connects the construction to [periodic neural states](../periodic-neural-states/) and [message-passing backflow](../message-passing-backflow/).

## A DeepSolid-based electron–nuclear construction

Chai et al. combine a DeepSolid-based electronic network with a nuclear network acting on periodic proton–proton features. Their nuclear log-amplitude is parameterized through learned distances,

$$
\log\Phi_\theta(\mathbf Q)=
-\sum_{A B}\sigma_{A B}^{\,2}
\left[d^{\mathrm{env}}_{\theta,A B}(\mathbf Q)-b_{A B}\right]^2,
$$

where $d^{\mathrm{env}}_{\theta,A B}$ is a neural correction to a periodic distance and $b_{A B},\sigma_{A B}$ are variational parameters. The nonlinear distance map allows non-Gaussian nuclear behavior. Their electronic network uses simulation-cell features, and the full state is optimized together with the cell for an enthalpy objective. Nuclear exchange is neglected in the phases studied (arXiv:2512.17703v3, Sec. II.1–II.2 and Supplemental Material I).

This illustrates a different way to represent nuclear correlations alongside an antisymmetric electronic state. The choice of nuclear statistics remains a physical assumption; electron determinants do not impose proton exchange symmetry.

## Nuclear derivatives act on the whole wavefunction

Let $F_\theta=D_\theta e^{J_\theta}$, so $\Psi_\theta=\Phi_\theta F_\theta$, and write $\nabla_A=\nabla_{\mathbf R_A}$. Away from zeros, the product rule gives

$$
\frac{\nabla_A^2\Psi_\theta}{\Psi_\theta}
=
\frac{\nabla_A^2\Phi_\theta}{\Phi_\theta}
+\frac{\nabla_A^2F_\theta}{F_\theta}
+2\,\frac{\nabla_A\Phi_\theta}{\Phi_\theta}
\cdot\frac{\nabla_AF_\theta}{F_\theta}.
$$

The nuclear kinetic energy therefore includes derivatives of the electronic orbitals and cross terms between the factors. Applying it only to $\Phi_\theta$ would evaluate a different energy functional. Joint optimization with these derivatives is what permits a treatment beyond a clamped-nucleus electronic problem; conditioning orbitals on nuclear coordinates alone does not establish that treatment.

Sampling must likewise use the complete $|\Psi_\theta(\mathbf R,\mathbf Q)|^2$. A proposed nuclear move generally changes every factor, so its acceptance ratio cannot be computed from $|\Phi_\theta|^2$ alone. Electron and nuclear proposals may use different step sizes while targeting the same joint distribution.

The [solids benchmark page](../solids/) separates clamped and quantum-proton instances and reports their energies. Comparisons must match the nuclear mass, exchange assumptions, localization constraints, cell and twist, as well as the electronic Hamiltonian.

## References

- D. Linteau, S. Moroni, G. Carleo, M. Holzmann, *Neural Wave Functions for High-Pressure Atomic Hydrogen*, arXiv:2504.07062v3 (2025). Coupled graphs, proton-centred orbitals and nuclear ansätze.
- S. Chai, C. Lin, X. Dong, Y. Li, W. Ouyang, L. Wang, X. C. Xie, *Revisiting the broken symmetry phase of solid hydrogen: A neural network variational Monte Carlo study*, arXiv:2512.17703v3 (2025). Electronic and nuclear networks with cell optimization.
